import * as React from 'react'

import { Repository } from '../../models/repository'
import { Dispatcher } from '../../lib/dispatcher'
import { sanitizedBranchName } from '../../lib/sanitize-branch'
import { Branch } from '../../models/branch'
import { TextBox } from '../lib/text-box'
import { Row } from '../lib/row'
import { Button } from '../lib/button'
import { ButtonGroup } from '../lib/button-group'
import { Dialog, DialogError, DialogContent, DialogFooter } from '../dialog'
import { Octicon, OcticonSymbol } from '../octicons'

interface ICreateBranchProps {
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void
  readonly branches: ReadonlyArray<Branch>
  readonly currentBranch: Branch | null
}

interface ICreateBranchState {
  readonly currentError: Error | null
  readonly proposedName: string
  readonly sanitizedName: string
  readonly baseBranch: Branch | null
  readonly loading: boolean
}

/** The Create Branch component. */
export class CreateBranch extends React.Component<ICreateBranchProps, ICreateBranchState> {
  public constructor(props: ICreateBranchProps) {
    super(props)

    this.state = {
      currentError: null,
      proposedName: '',
      sanitizedName: '',
      baseBranch: this.props.currentBranch,
      loading: false,
    }
  }

  private renderSanitizedName() {
    if (this.state.proposedName === this.state.sanitizedName) { return null }

    return (
      <Row className='warning-helper-text'>
        <Octicon symbol={OcticonSymbol.alert} />
        Will be created as {this.state.sanitizedName}
      </Row>
    )
  }

  public render() {
    const proposedName = this.state.proposedName
    const disabled = !proposedName.length || !!this.state.currentError
    const currentBranch = this.props.currentBranch
    const error = this.state.currentError

    return (
      <Dialog
        title='Create a branch'
        onSubmit={this.createBranch}
        onDismissed={this.props.onDismissed}
        loading={this.state.loading}
        disabled={this.state.loading}
      >
        {error ? <DialogError>{error.message}</DialogError> : null}

        <DialogContent>
          <Row>
            <TextBox
              label='Name'
              autoFocus={true}
              onChange={this.onBranchNameChange} />
          </Row>

          {this.renderSanitizedName()}

          <Row>
            <button>default branch</button>
            <button disabled={!currentBranch}>{currentBranch ? currentBranch.name : 'No branch'}</button>
          </Row>
        </DialogContent>

        <DialogFooter>
          <ButtonGroup>
            <Button type='submit' disabled={disabled}>{__DARWIN__ ? 'Create Branch' : 'Create branch'}</Button>
            <Button onClick={this.props.onDismissed}>Cancel</Button>
          </ButtonGroup>
        </DialogFooter>
      </Dialog>
    )
  }

  private onBranchNameChange = (event: React.FormEvent<HTMLInputElement>) => {
    const str = event.currentTarget.value
    const sanitizedName = sanitizedBranchName(str)
    const alreadyExists = this.props.branches.findIndex(b => b.name === sanitizedName) > -1
    let currentError: Error | null = null
    if (alreadyExists) {
      currentError = new Error(`A branch named ${sanitizedName} already exists`)
    }

    this.setState({
      currentError,
      proposedName: str,
      baseBranch: this.state.baseBranch,
      sanitizedName,
    })
  }

  // private onBaseBranchChange = (event: React.FormEvent<HTMLSelectElement>) => {
  //   const baseBranchName = event.currentTarget.value
  //   const baseBranch = this.props.branches.find(b => b.name === baseBranchName)!
  //   this.setState({
  //     currentError: this.state.currentError,
  //     proposedName: this.state.proposedName,
  //     baseBranch,
  //     sanitizedName: this.state.sanitizedName,
  //   })
  // }

  private createBranch = async () => {
    const name = this.state.sanitizedName
    const baseBranch = this.state.baseBranch
    if (name.length > 0 && baseBranch) {
      this.setState({ loading: true })
      await this.props.dispatcher.createBranch(this.props.repository, name, baseBranch.name)
      this.props.onDismissed()
    }
  }
}
